import { asyncHandler } from '../utils/asynchandler.js';
import { ApiError } from '../utils/ApiError.js';
import { ApiResponse } from "../utils/ApiResponse.js";
import appwriteService from '../appwriteClass/code.js';

const fetchController = asyncHandler(async (req,res) => {
    const {fileId} = req.params;
    
})

export {fetchController}