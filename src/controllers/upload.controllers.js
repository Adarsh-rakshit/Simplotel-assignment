import { asyncHandler } from '../utils/asynchandler.js';
import { ApiError } from '../utils/ApiError.js';
import { ApiResponse } from "../utils/ApiResponse.js";
import appwriteService from '../appwriteClass/code.js';
// controllers

const uploadController = asyncHandler(async (req, res) => {
    const file = req.file;
    if (!file) {
        throw new ApiError(400, 'Please upload a file');
    }
    const filepath = file.path;
    const UploadData = await appwriteService.uploadFile(filepath);
    const fileId = UploadData.$id;
    const fileUrl = `http://localhost:8080/files/${fileId}`;

    return res.status(201).json(
        new ApiResponse(201,
            { fileId: fileId, url: fileUrl },
            "File uploaded successfully"
        )
    );
})

const deleteController = asyncHandler(async (req, res) => {
    const { fileId } = req.params;
    if (!fileId) {
        throw new ApiError(400, 'Please give a file')
    }
    await appwriteService.deleteFile(fileId);
    return res.status(200).json(
        new ApiResponse(201, { fileId }, "file deleted successfully")
    )
})

export { uploadController,deleteController }