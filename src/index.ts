import App from './App';

const express = new App().getExpress();
const port = process.env.PORT || 3002;

express.listen(port, (err: any) => {
  if (err) {
    return console.log(err);
  }

  return console.log(`Server running on port ${port}`);
});
