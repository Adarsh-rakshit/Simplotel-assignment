import express from "express"
import { router } from "./routes.js";
const app = express();
app.use(express.json());
app.use(express.urlencoded({extended: true, limit: "16kb"}));
app.use(router);

export {app};