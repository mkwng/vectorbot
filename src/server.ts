import express from 'express';
import { monthlyPost } from '.';

const server = express();

server.all('/', (req, res) => {
  monthlyPost();
  res.send('Hello World');
});

export const startServer = () => {
  server.listen(3000, () => {
    console.log('Server started on port 3000');
  });
};
