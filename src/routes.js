import {Router} from "express"
import {upload} from "./middleware.js"
import {uploadController, deleteController} from "./controllers/upload.controllers.js"
import { fetchController } from "./controllers/fetch.controllers.js";
const router = Router();

//upload Route
router.route("/upload").post(upload.single("file"), uploadController);

//fetch file route
router.route("/files/:fileId").get(fetchController);
router.route("/files/:fileId").delete(deleteController);

export {router};