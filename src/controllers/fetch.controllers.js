import { asyncHandler } from '../utils/asynchandler.js';
import { ApiError } from '../utils/ApiError.js';
import { ApiResponse } from "../utils/ApiResponse.js";
import appwriteService from '../appwriteClass/code.js';
import { fileTypeFromBuffer } from 'file-type';
import fs from 'fs/promises';
import path from "path"
import sharp from "sharp"

const filemaker = async (fileId) => {
    try {
        const arrayBuffer = await appwriteService.getFile(fileId);
        
        const fileBuffer = Buffer.from(arrayBuffer);

        const fileType = await fileTypeFromBuffer(fileBuffer);
        if (!fileType) {
            throw new ApiError(400, "Could not determine file type");
        }

        const allowedImageTypes = ['jpg', 'jpeg', 'png', 'gif', 'webp'];
        const allowedVideoTypes = ['mp4', 'webm', 'mpeg'];

        const isImage = allowedImageTypes.includes(fileType.ext);
        const isVideo = allowedVideoTypes.includes(fileType.ext);

        if (!isImage && !isVideo) {
            throw new ApiError(400, "Invalid file type. Only images and videos are allowed");
        }

        const tempFilePath = path.join(
            process.cwd(), 
            'public', 
            'tempdownloads', 
            `${fileId}-${Date.now()}.${fileType.ext}`
        );
        
        await fs.writeFile(tempFilePath, fileBuffer);

        return {
            filePath: tempFilePath,
            type: isImage ? 'image' : 'video',
            mime: fileType.mime,
            extension: fileType.ext
        };

    } catch (error) {
        throw new ApiError(500, `Error in filemaker: ${error.message}`);
    }
};

const ImageHandler = async (fileObj, transformationObj) => {
    try {
        const {width, height, format, filter, crop} = transformationObj;
        
        const outputPath = fileObj.filePath + '.processed';
        
        let sharpInstance = sharp(fileObj.filePath);

        if (crop) {
            const [left, top, cropWidth, cropHeight] = crop.split(',').map(Number);
            if (isNaN(left) || isNaN(top) || isNaN(cropWidth) || isNaN(cropHeight)) {
                throw new ApiError(400, "Invalid crop parameters. Format: x,y,width,height");
            }
            const metadata = await sharpInstance.metadata();

            if (left + cropWidth > metadata.width || top + cropHeight > metadata.height) {
                throw new ApiError(400, "Crop dimensions exceed image bounds");
            }

            sharpInstance.extract({
                left,
                top,
                width: cropWidth,
                height: cropHeight
            });
        }

        if (width || height) {
            sharpInstance.resize(
                parseInt(width) || null, 
                parseInt(height) || null,
                {
                    fit: 'contain',
                    background: { r: 255, g: 255, b: 255, alpha: 1 }
                }
            );
        }

        if (filter) {
            switch(filter.toLowerCase()) {
                case 'grayscale':
                    sharpInstance.grayscale();
                    break;
                case 'blur':
                    sharpInstance.blur(3);
                    break;
                case 'sharpen':
                    sharpInstance.sharpen();
                    break;
            }
        }


        if (format) {
            switch(format.toLowerCase()) {
                case 'jpeg':
                case 'jpg':
                    sharpInstance.jpeg();
                    break;
                case 'png':
                    sharpInstance.png();
                    break;
                case 'webp':
                    sharpInstance.webp();
                    break;
                case 'avif':
                    sharpInstance.avif();
                    break;
            }
        }


        await sharpInstance.toFile(outputPath);


        await fs.unlink(fileObj.filePath);
        await fs.rename(outputPath, fileObj.filePath);

    } catch (error) {

        try {
            await fs.unlink(fileObj.filePath + '.processed');
        } catch {

        }
        throw new ApiError(500, `Image processing error: ${error.message}`);
    }
};
const VideoHandler = async (fileObj, transformationObj) => {
}

const fetchController = asyncHandler(async (req,res) => {
    const {fileId} = req.params;
    const transformationObj = req.query;

    if(!fileId){
        throw new ApiError(400, "need a fileId to process");
    }

    try {
        const file = await filemaker(fileId);
        
        if(!file){
            throw new ApiError(500, "internal server error in filemaker");
        }


        if(file.type === 'image'){
            await ImageHandler(file, transformationObj);
        }
        else if(file.type === 'video'){
            await VideoHandler(file, transformationObj);
        }
        res.download(file.filePath, `processed-${fileId}.${file.extension}`, async (err) => {
            if (err) {
                console.error("Download error:", err);
            }
         
         try {
                await fs.unlink(file.filePath);
            } catch (cleanupError) {
                console.error("Cleanup error:", cleanupError);
            }
        });
        
    } catch (error) {

        throw new ApiError(500, error.message);
    }
});

export {fetchController}