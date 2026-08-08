import { app, config } from "./app";

app.listen(config.port, () => {
  console.log(`NetMaster API listening on http://localhost:${config.port}`);
});
