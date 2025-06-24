import os
import boto3
import logging
from botocore.exceptions import ClientError
from pathlib import Path
from concurrent.futures import ThreadPoolExecutor
import mimetypes

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

STORAGE_TYPE = "r2"
CLOUDFLARE_R2_ACCESS_KEY = ""
CLOUDFLARE_R2_SECRET_KEY = ""
CLOUDFLARE_R2_ENDPOINT = ""
CLOUDFLARE_R2_BUCKET = ""

REPOSITORY_PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)), "repository")

def get_content_type(file_path):
    content_type, _ = mimetypes.guess_type(file_path)
    if content_type:
        return content_type
    
    
    ext = os.path.splitext(file_path)[1].lower()
    if ext == '.sus':
        return 'text/plain'
    if ext == '.usc':
        return 'application/json'
    
    return 'application/octet-stream'  

def upload_file(s3_client, file_path, bucket, object_name):
    try:
        content_type = get_content_type(file_path)
        s3_client.upload_file(
            file_path, 
            bucket, 
            object_name, 
            ExtraArgs={'ContentType': content_type}
        )
        logger.info(f"success: {object_name}")
        return True
    except ClientError as e:
        logger.error(f"failed {file_path} -> {object_name}: {e}")
        return False

def main():
    
    s3_client = boto3.client(
        's3',
        endpoint_url=CLOUDFLARE_R2_ENDPOINT,
        aws_access_key_id=CLOUDFLARE_R2_ACCESS_KEY,
        aws_secret_access_key=CLOUDFLARE_R2_SECRET_KEY,
        region_name='auto'
    )
    
    
    if not os.path.exists(REPOSITORY_PATH):
        logger.error(f"not found: {REPOSITORY_PATH}")
        return

    
    total_files = 0
    upload_tasks = []
    
    logger.info(f"scan start: {REPOSITORY_PATH}")
    
    for root, _, files in os.walk(REPOSITORY_PATH):
        for file in files:
            local_path = os.path.join(root, file)
            
            rel_path = os.path.relpath(local_path, os.path.dirname(REPOSITORY_PATH))
            r2_path = f"us/{rel_path}".replace("\\", "/")
            
            upload_tasks.append((local_path, r2_path))
            total_files += 1
    
    logger.info(f"upload: {total_files}")
    
    success_count = 0
    with ThreadPoolExecutor(max_workers=10) as executor:
        for local_path, r2_path in upload_tasks:
            if upload_file(s3_client, local_path, CLOUDFLARE_R2_BUCKET, r2_path):
                success_count += 1
    
    logger.info(f"success:  {success_count}/{total_files}")

if __name__ == "__main__":
    logger.info("start")
    main()
    logger.info("complete")