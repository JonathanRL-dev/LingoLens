import { createServer } from 'node:http';
import process from 'node:process';
import { APP_NAME } from '@lingolens/shared';

const server = createServer((request, response) => {
  if (request.method === 'GET' && request.url === '/health') {
    response.writeHead(200, { 'Content-Type': 'application/json' });
    response.end(JSON.stringify({ status: 'ok', app: APP_NAME }));
    return;
  }

  response.writeHead(404);
  response.end();
});

server.listen(Number(process.env.PORT ?? 4000));
