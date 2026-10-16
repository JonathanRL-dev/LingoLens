import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { z } from 'zod';
import { schemas } from '../shared/src/schemas/index';
import { endpoints } from './api-contract';

const check = process.argv.includes('--check');
function emit(file: string, contents: string) {
  if (check) {
    if (readFileSync(file, 'utf8') !== contents) throw new Error(file + ' perlu digenerasi ulang');
  } else {
    writeFileSync(file, contents);
  }
}
const registry = z.registry<{ id: string }>();
for (const [id, schema] of Object.entries(schemas)) registry.add(schema, { id });
const generated = z.toJSONSchema(registry, { uri: (id) => '#/components/schemas/' + id });
const components = generated.schemas as Record<string, Record<string, unknown>>;
for (const schema of Object.values(components)) {
  delete schema.$id;
  delete schema.$schema;
}
components.Exercise = {
  oneOf: ['ChoiceExercise', 'ClozeExercise', 'OrderExercise'].map((id) => ({
    $ref: '#/components/schemas/' + id,
  })),
  discriminator: {
    propertyName: 'kind',
    mapping: Object.fromEntries(
      ['choice', 'cloze', 'order'].map((kind) => [
        kind,
        '#/components/schemas/' + kind[0]!.toUpperCase() + kind.slice(1) + 'Exercise',
      ]),
    ),
  },
};
const ref = (name: string) => ({ $ref: '#/components/schemas/' + name });
const responses: Record<string, unknown> = {};
const descriptions: Record<number, string> = {
  401: 'Autentikasi tidak sah',
  404: 'Sumber daya tidak ditemukan',
  409: 'Operasi bertentangan dengan keadaan sesi atau misi',
  422: 'Validasi masukan gagal',
  429: 'Terlalu banyak permintaan',
  500: 'Kesalahan internal server; pemetaan kode dari enum wajib menunggu keputusan PM.',
};
for (const [status, description] of Object.entries(descriptions)) {
  responses[status] = {
    description,
    content: { 'application/json': { schema: ref('ErrorResponse') } },
  };
}
responses['204'] = { description: 'Berhasil tanpa isi respons' };
const failures: Record<string, string> = {
  Guest: '422 VALIDATION_ERROR bila nickname kosong atau ditolak kebijakan kata kasar.',
  MissionDetail: '404 NOT_FOUND bila misi tidak ditemukan.',
  StartSession: '409 MISSION_LOCKED bila prasyarat misi belum selesai.',
  Hint: '409 SESSION_COMPLETED bila sesi telah selesai.',
  Scan: '409 SESSION_COMPLETED bila sesi telah selesai.',
  Exercises: '409 SESSION_NOT_SCANNED bila pindai belum berhasil.',
  Answer:
    '404 EXERCISE_NOT_FOUND atau 409 ATTEMPTS_EXHAUSTED. Hint diberikan setelah salah pertama; correctAnswer hanya setelah gagal pada kesempatan terakhir.',
  Complete:
    '409 SESSION_NOT_SCANNED bila belum dipindai; 409 PRACTICE_INCOMPLETE bila latihan belum selesai dan skippedPractice bukan true. Pemanggilan ulang mengembalikan hasil tersimpan tanpa kredit XP ulang.',
  Vocabulary:
    '404 NOT_FOUND bila kosakata tidak ditemukan; hanya kalimat choice terbuka pada kartu.',
};
const paths: Record<string, Record<string, unknown>> = {};
if (!check) mkdirSync('docs/examples', { recursive: true });
for (const endpoint of endpoints) {
  const example = endpoint.status === 204 ? null : { success: true, data: endpoint.data };
  if (endpoint.request) endpoint.request.schema.parse(endpoint.request.example);
  if (endpoint.status !== 204) {
    const responseSchema = schemas[(endpoint.name + 'Response') as keyof typeof schemas];
    if (!responseSchema) throw new Error(endpoint.name + ': skema respons tidak ditemukan');
    responseSchema.parse(example);
  }
  emit('docs/examples/' + endpoint.name + '.json', JSON.stringify(example, null, 2) + '\n');
  const operation: Record<string, unknown> = {
    operationId: endpoint.name[0]!.toLowerCase() + endpoint.name.slice(1),
    summary: endpoint.summary,
    security: endpoint.public ? [] : [{ bearerAuth: [] }],
  };
  if (failures[endpoint.name]) operation.description = failures[endpoint.name];
  const params: unknown[] = [...endpoint.path.matchAll(/\{(\w+)\}/g)].map((match) => ({
    name: match[1],
    in: 'path',
    required: true,
    description: 'ID sumber daya',
    schema: { type: 'string', minLength: 1 },
  }));
  if (endpoint.name === 'Reset') {
    // ASUMSI: Nama header reset belum ditentukan oleh spesifikasi sumber.
    params.push({
      name: 'X-Demo-Reset-Key',
      in: 'header',
      required: true,
      description: 'Kunci demo; tidak menggunakan JWT',
      schema: { type: 'string', minLength: 1 },
    });
  }
  if (params.length) operation.parameters = params;
  if (endpoint.request)
    operation.requestBody = {
      required: true,
      content: {
        'application/json': {
          schema: ref(endpoint.request.name),
          example: endpoint.request.example,
        },
      },
    };
  const operationResponses: Record<string, unknown> = {
    [endpoint.status]:
      endpoint.status === 204
        ? { $ref: '#/components/responses/204' }
        : {
            description: endpoint.status === 201 ? 'Berhasil dibuat' : 'Berhasil',
            content: { 'application/json': { schema: ref(endpoint.name + 'Response'), example } },
          },
  };
  for (const status of new Set([
    ...(endpoint.public ? [] : [401]),
    ...(endpoint.errors ?? []),
    429,
    500,
  ])) {
    operationResponses[status] = { $ref: '#/components/responses/' + status };
  }
  operation.responses = operationResponses;
  (paths[endpoint.path] ??= {})[endpoint.method] = operation;
}
const document = {
  openapi: '3.1.0',
  info: {
    title: 'LingoLens API',
    version: '1.0.0',
    description: 'Kontrak Fase 1; draft menunggu penandatanganan PM.',
  },
  servers: [{ url: '/api/v1' }],
  paths,
  components: {
    securitySchemes: { bearerAuth: { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' } },
    responses,
    schemas: components,
  },
};
// Serializer YAML terbatas pada nilai JSON; tidak menambah dependensi di luar fase.
function yaml(value: unknown, depth = 0): string {
  const indent = '  '.repeat(depth);
  if (Array.isArray(value) && value.length) {
    return value
      .map(
        (item) =>
          indent +
          '-' +
          (item !== null && typeof item === 'object'
            ? '\n' + yaml(item, depth + 1)
            : ' ' + JSON.stringify(item)),
      )
      .join('\n');
  }
  if (value !== null && typeof value === 'object' && Object.keys(value).length) {
    return Object.entries(value)
      .map(
        ([key, item]) =>
          indent +
          JSON.stringify(key) +
          ':' +
          (item !== null && typeof item === 'object' && Object.keys(item).length
            ? '\n' + yaml(item, depth + 1)
            : ' ' + JSON.stringify(item)),
      )
      .join('\n');
  }
  return indent + JSON.stringify(value);
}
const header =
  [
    '# Generated by npm run api:generate. Edit shared/src/schemas/index.ts or scripts/api-contract.ts.',
    '# ASUMSI: ID string; category, difficulty, status teks; index exercise mulai 0.',
    '# ASUMSI: translations[], related[], exampleSentence objek minimal tanpa bidang wajib.',
    '# ASUMSI: vocabulary koleksi terkunci hanya { id }; header reset X-Demo-Reset-Key.',
    '# ASUMSI: POST auth/guest dan sessions mengembalikan 201; details objek atau null.',
    '# ASUMSI: Enum tidak menyediakan INTERNAL_ERROR; kode body 500 belum dibekukan PM.',
    '# correctAnswer hanya pada respons answers setelah gagal dan attemptsLeft = 0.',
  ].join('\n') + '\n';
emit('docs/openapi.yaml', header + yaml(document) + '\n');
