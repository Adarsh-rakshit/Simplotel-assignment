import {Router} from "express"
import {upload} from "./middleware.js"
import {uploadController, deleteController} from "./controllers/upload.controllers.js"
const router = Router();

//upload Route
router.route("/upload").post(upload.single("file"), uploadController);

//fetch file route
router.route("/files/:fileId").get();
router.route("/files/:fileId").delete(deleteController);

export {router};