import test from "node:test";
import assert from "node:assert/strict";
import {
  mkdtemp,
  mkdir,
  writeFile,
  readFile,
  rm,
  readdir,
} from "node:fs/promises";
import path from "node:path";
import os from "node:os";
import sharp from "sharp";
import {
  search,
  download,
  transform,
  prepare,
  verify,
  hash,
  requireKey,
  selectCandidate,
} from "../../skills/imagens-equipamentos/scripts/pipeline.mjs";

async function tempCase(run) {
  const temp = await mkdtemp(path.join(os.tmpdir(), "empresti-imagens-"));
  try {
    await run(temp);
  } finally {
    assert.equal(path.dirname(temp), os.tmpdir());
    await rm(temp, { recursive: true, force: true });
  }
}
const source = (id) => ({
  id,
  author: "Autor fictício do teste",
  authorId: id + 1000,
  pageURL: `https://pixabay.com/photos/test-${id}/`,
  downloadURL: `https://cdn.pixabay.com/photo/test-${id}.jpg`,
});

test("CA-D07: chave ausente falha antes da rede; erro do provedor não expõe segredo", async () => {
  assert.throws(() => requireKey(""), /PIXABAY_API_KEY/);
  await tempCase(async (dir) => {
    let calls = 0;
    const fetcher = async () => {
      calls++;
      throw new Error("valor-ficticio-nao-deve-vazar");
    };
    await assert.rejects(
      search("laptop", undefined, dir, { fetcher }),
      /PIXABAY_API_KEY/,
    );
    assert.equal(calls, 0);
    await assert.rejects(
      search("laptop", "chave-ficticia", dir, { fetcher }),
      (error) =>
        !error.message.includes("valor-ficticio") &&
        !error.message.includes("chave-ficticia"),
    );
  });
});

test("CA-D03/D07: cache 24h, filtros de foto e sanitização sem chave no disco", async () => {
  await tempCase(async (dir) => {
    let calls = 0;
    const fetcher = async (input, options) => {
      calls++;
      const url = new URL(input);
      assert.equal(url.hostname, "pixabay.com");
      assert.equal(url.searchParams.get("image_type"), "photo");
      assert.equal(url.searchParams.get("safesearch"), "true");
      assert.equal(url.searchParams.get("min_width"), "800");
      assert.equal(url.searchParams.get("min_height"), "600");
      assert.equal(options.method, "GET");
      return Response.json({
        hits: [
          {
            id: 12,
            user: "teste",
            user_id: 8,
            pageURL: "https://pixabay.com/photos/test-12/",
            largeImageURL: "https://cdn.pixabay.com/photo/test-12.jpg",
            unrelated: "descartar",
          },
        ],
      });
    };
    const first = await search("laptop", "chave-ficticia", dir, {
      fetcher,
      now: 1000,
    });
    assert.deepEqual(
      await search("laptop", "outra-chave-ficticia", dir, {
        fetcher,
        now: 1001,
      }),
      first,
    );
    assert.equal(calls, 1);
    await search("laptop", "chave-ficticia", dir, {
      fetcher,
      now: 1000 + 24 * 60 * 60 * 1000,
    });
    assert.equal(calls, 2);
    const [filename] = await readdir(path.join(dir, "cache"));
    const persisted = await readFile(path.join(dir, "cache", filename), "utf8");
    assert.ok(
      !persisted.includes("chave-ficticia") && !persisted.includes("unrelated"),
    );
  });
});

test("D03: página e categoria têm caches distintos e paginação inválida não chama a rede", async () => {
  await tempCase(async (dir) => {
    const calls = [];
    const fetcher = async (input) => {
      const url = new URL(input);
      calls.push([
        url.searchParams.get("page"),
        url.searchParams.get("category"),
        url.searchParams.get("order"),
      ]);
      return Response.json({ hits: [] });
    };
    await search("monitor", "ficticia", dir, { fetcher });
    await search("monitor", "ficticia", dir, { fetcher, page: 2 });
    await search("monitor", "ficticia", dir, { fetcher, order: "latest" });
    await search("monitor", "ficticia", dir, { fetcher, order: "latest" });
    await search("monitor", "ficticia", dir, { fetcher, category: "computer" });
    await search("monitor", "ficticia", dir, { fetcher, page: 2 });
    assert.deepEqual(calls, [
      ["1", null, "popular"],
      ["2", null, "popular"],
      ["1", null, "latest"],
      ["1", "computer", "popular"],
    ]);
    assert.equal((await readdir(path.join(dir, "cache"))).length, 4);
    await search("monitor", "ficticia", dir, { fetcher, page: 10 });
    assert.equal(calls.at(-1)[0], "10");
    for (const page of [0, 11, 1.5]) {
      await assert.rejects(
        search("monitor", "ficticia", dir, { fetcher, page }),
      );
    }
    await assert.rejects(
      search("monitor", "ficticia", dir, { fetcher, category: "outra" }),
    );
    await assert.rejects(
      search("monitor", "ficticia", dir, { fetcher, order: "invalid" }),
    );
    assert.equal(calls.length, 5);
  });
});

test("CA-D07: download bloqueia origem externa, redirect externo e conteúdo excessivo", async () => {
  let calls = 0;
  await assert.rejects(
    download(
      { downloadURL: "https://example.com/photo/a.jpg" },
      {
        fetcher: async () => {
          calls++;
        },
      },
    ),
    /fora do Pixabay/,
  );
  assert.equal(calls, 0);
  await assert.rejects(
    download(source(1), {
      fetcher: async () =>
        new Response(null, {
          status: 302,
          headers: { location: "http://127.0.0.1/private" },
        }),
    }),
    /fora do Pixabay/,
  );
  await assert.rejects(
    download(source(1), {
      fetcher: async () =>
        new Response("x", {
          headers: {
            "content-type": "image/jpeg",
            "content-length": String(13 * 1024 * 1024),
          },
        }),
    }),
    /12 MiB/,
  );
});

test("CA-D03/D04: selecionar não aprova a foto, não duplica ID e reutiliza original local", async () => {
  await tempCase(async (dir) => {
    await writeFile(
      path.join(dir, "candidatos.json"),
      JSON.stringify([
        { assetTag: "TI-0001", candidates: [source(1)] },
        { assetTag: "TI-0002", candidates: [source(1)] },
      ]),
    );
    const bytes = await sharp({
      create: { width: 120, height: 80, channels: 3, background: "red" },
    })
      .png()
      .toBuffer();
    let calls = 0;
    const fetcher = async () => {
      calls++;
      return new Response(bytes, { headers: { "content-type": "image/png" } });
    };
    await selectCandidate("TI-0001", 1, dir, { fetcher });
    await selectCandidate("TI-0001", 1, dir, { fetcher });
    assert.equal(calls, 1);
    const reviews = JSON.parse(
      await readFile(path.join(dir, "revisao.json"), "utf8"),
    );
    assert.equal(reviews.length, 1);
    assert.equal(reviews[0].decision, "pending");
    await assert.rejects(
      selectCandidate("TI-0002", 1, dir, { fetcher }),
      /outro equipamento/,
    );
    assert.equal(calls, 1);
  });
});

test("CA-D03: WebP 800×600 sem cortar foto panorâmica ou retrato; rejeita arquivo falso", async () => {
  for (const [width, height] of [
    [1200, 200],
    [200, 1200],
  ]) {
    const original = await sharp({
      create: { width, height, channels: 3, background: "#ff0000" },
    })
      .png()
      .toBuffer();
    const result = await transform(original);
    const metadata = await sharp(result).metadata();
    assert.equal(metadata.width, 800);
    assert.equal(metadata.height, 600);
    assert.equal(metadata.format, "webp");
    const { data } = await sharp(result)
      .raw()
      .toBuffer({ resolveWithObject: true });
    const center = (300 * 800 + 400) * 3;
    assert.ok(data[center] > 240 && data[center + 1] < 15);
    // A borda permanece escura: a imagem foi contida, não cortada para preencher.
    assert.ok(data[0] < 40 && data[1] < 40 && data[2] < 60);
  }
  await assert.rejects(
    transform(Buffer.from("não é imagem")),
    /imagem inválido/,
  );
});

async function fixture(dir, count = 12) {
  const inventory = [],
    selections = [],
    reviews = [];
  await mkdir(path.join(dir, "originais"));
  for (let i = 1; i <= count; i++) {
    const assetTag = `TI-${String(i).padStart(4, "0")}`;
    const bytes = await sharp({
      create: {
        width: 120,
        height: 80,
        channels: 3,
        background: { r: i * 17, g: i * 8, b: i * 3 },
      },
    })
      .png()
      .toBuffer();
    const sourceSha256 = hash(bytes);
    inventory.push({ assetTag, query: "fixture sintética" });
    selections.push({ ...source(i), assetTag, sourceSha256 });
    reviews.push({
      assetTag,
      candidateId: i,
      sourceSha256,
      decision: "approved",
      reviewer: "teste automatizado — não é revisão de foto real",
      reviewedAt: "2026-11-06T12:00:00Z",
      reason: "fixture sintética",
    });
    await writeFile(
      path.join(dir, "originais", `${assetTag}-${i}.image`),
      bytes,
    );
  }
  await writeFile(path.join(dir, "selecoes.json"), JSON.stringify(selections));
  await writeFile(path.join(dir, "revisao.json"), JSON.stringify(reviews));
  return { inventory, selections, reviews };
}

test("CA-D03/D04: pacote requer revisão atual, rejeita conjunto incompleto e arquivo alterado", async () => {
  await tempCase(async (dir) => {
    const { inventory, selections, reviews } = await fixture(dir, 2);
    reviews[0].decision = "pending";
    await writeFile(path.join(dir, "revisao.json"), JSON.stringify(reviews));
    await assert.rejects(prepare(inventory, dir), /Revisão visual/);
    await assert.rejects(readFile(path.join(dir, "manifesto.json")));
    reviews[0].decision = "approved";
    await writeFile(path.join(dir, "revisao.json"), JSON.stringify(reviews));
    await writeFile(
      path.join(dir, "originais", `${inventory[0].assetTag}-1.image`),
      "alterado",
    );
    await assert.rejects(prepare(inventory, dir), /Original mudou/);
    await writeFile(
      path.join(dir, "selecoes.json"),
      JSON.stringify(selections.slice(0, 1)),
    );
    await assert.rejects(prepare(inventory, dir), /incompletas/);
  });
});

test("CA-D04: aprovação sem revisor, motivo ou data válida não autoriza pacote", async () => {
  await tempCase(async (dir) => {
    const { inventory, reviews } = await fixture(dir, 1);
    for (const invalid of [
      { reviewer: " " },
      { reason: " " },
      { reviewedAt: null },
      { reviewedAt: "ontem" },
    ]) {
      await writeFile(
        path.join(dir, "revisao.json"),
        JSON.stringify([{ ...reviews[0], ...invalid }]),
      );
      await assert.rejects(prepare(inventory, dir), /Revisão visual/);
    }
  });
});

test("CA-D03: detecta mesma foto por ID e por bytes, mesmo com outro ID", async () => {
  await tempCase(async (dir) => {
    const { inventory, selections, reviews } = await fixture(dir, 2);
    const bytes = await readFile(
      path.join(dir, "originais", "TI-0001-1.image"),
    );
    selections[1].sourceSha256 = selections[0].sourceSha256;
    reviews[1].sourceSha256 = selections[0].sourceSha256;
    await writeFile(path.join(dir, "originais", "TI-0002-2.image"), bytes);
    await writeFile(
      path.join(dir, "selecoes.json"),
      JSON.stringify(selections),
    );
    await writeFile(path.join(dir, "revisao.json"), JSON.stringify(reviews));
    await assert.rejects(prepare(inventory, dir), /Foto repetida/);
  });
});

test("CA-D02/D03: 12 arquivos idempotentes, créditos íntegros e pacote invalidado por revisão posterior", async () => {
  await tempCase(async (dir) => {
    const { inventory, reviews } = await fixture(dir);
    const first = await prepare(inventory, dir);
    assert.deepEqual(await prepare(inventory, dir), first);
    assert.equal((await readdir(path.join(dir, "preparadas"))).length, 12);
    assert.equal(first.entries.length, 12);
    assert.equal(new Set(first.entries.map((entry) => entry.sha256)).size, 12);
    assert.ok(
      first.entries.every(
        (entry) =>
          entry.source.author &&
          entry.source.license.url &&
          entry.objectPath === `suporte_ti/${entry.assetTag}.webp`,
      ),
    );
    assert.deepEqual(await verify(inventory, dir), first);
    reviews.push({
      ...reviews[0],
      decision: "rejected",
      reason: "revisão posterior",
    });
    await writeFile(path.join(dir, "revisao.json"), JSON.stringify(reviews));
    await assert.rejects(verify(inventory, dir), /Revisão visual/);
  });
});
