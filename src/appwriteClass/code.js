import { APPWRITE_CONFIG } from "../constants.js"
import { Client, Storage, ID } from "node-appwrite";
import fs from "fs";
import { ApiError } from "../utils/ApiError.js";


export class Service {
    client = new Client();
    bucket;

    constructor() {
        try {
            this.client
                .setEndpoint(APPWRITE_CONFIG.ENDPOINT)
                .setKey(APPWRITE_CONFIG.API_KEY)
                .setProject(APPWRITE_CONFIG.PROJECT_ID);

            this.bucket = new Storage(this.client);

            console.log("Appwrite Client Initialized Successfully");

        } catch (error) {
            console.error("Error Initializing Appwrite Client:", error);
        }
    }

    async getFile(fileId) {

    }

    async uploadFile(filepath) {
        try {
            if(!filepath){
                throw new ApiError(500,"internal server error in filepath");
            }
            const fileBuffer = await fs.promises.readFile(filepath);
            const file = new File([fileBuffer], filepath.split('\\').pop(), {
                type: 'application/octet-stream'
            });
    
            const response = await this.bucket.createFile(
                APPWRITE_CONFIG.BUCKET,
                ID.unique(),
                file,
                []
            );
            fs.unlinkSync(filepath);
            return response;
        } catch (error) {
            console.error("File upload failed:", error.message);
            return null;
        }
    }

    async deleteFile(fileId) {
        try {
            if(!fileId){
                throw ApiError(500, "Cannot recieve the file delete controller")
            }

            // need some logic for what if user sends illegitimate fileId
            
            const response = await this.bucket.deleteFile(APPWRITE_CONFIG.BUCKET, fileId);
            console.log(response);
            return response;    
        } catch (error) {
            throw new ApiError(500, "cannot delete the file and failed at deletefile", error)
        }
    }

}

const appwriteService = new Service();
export default appwriteService;