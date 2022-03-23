import express from 'express';
import { monthlyPost } from '.';

const server = express();

// https://www.easycron.com/cron/log/id/3687694
server.all('/', (req, res) => {
  console.log('Request triggered');
  monthlyPost();
  res.send('Hello World');
});

export const startServer = () => {
  server.listen(process.env.PORT || 3000, () => {
    console.log(`Server started on port ${process.env.PORT || 3000}`);
  });
};
