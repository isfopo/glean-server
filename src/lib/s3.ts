import { S3Client } from "@aws-sdk/client-s3";
import { Upload } from "@aws-sdk/lib-storage";
import { Readable } from "stream";

const s3 = new S3Client({
  endpoint: process.env.S3_ENDPOINT,
  region: "us-east-1", // required for v3, can be anything for MinIO
  credentials: {
    accessKeyId: process.env.S3_ACCESS_KEY!,
    secretAccessKey: process.env.S3_SECRET_KEY!,
  },
  forcePathStyle: true, // needed for MinIO
});

export const uploadStream = async (
  bucket: string,
  key: string,
  stream: Readable,
  contentType: string,
) => {
  const upload = new Upload({
    client: s3,
    params: {
      Bucket: bucket,
      Key: key,
      Body: stream,
      ContentType: contentType,
    },
  });

  return upload.done();
};

export const getPublicUrl = (bucket: string, key: string) => {
  // With path-style access, the URL is straightforward
  return `${process.env.S3_ENDPOINT}/${bucket}/${key}`;
};
