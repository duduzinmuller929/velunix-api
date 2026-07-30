import {
    DeleteObjectCommand,
    GetObjectCommand,
    type GetObjectCommandOutput,
    HeadObjectCommand,
    type HeadObjectCommandOutput,
    PutObjectCommand,
    S3Client,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

const s3 = new S3Client({
    region: process.env.MINIO_REGION!,
    endpoint: process.env.MINIO_ENDPOINT!,
    credentials: {
        accessKeyId: process.env.MINIO_ROOT_USER!,
        secretAccessKey: process.env.MINIO_ROOT_PASSWORD!,
    },
    forcePathStyle: true,
});

export const Buckets = {
    AVATARS: 'avatars',
    DOCUMENTS: 'documents',
    IMAGES: 'images',
    AUDIOS: 'audios',
    TEMP: 'temp',
} as const;

export type Bucket = (typeof Buckets)[keyof typeof Buckets];

export interface UploadFileOptions {
    bucket: Bucket | string;
    key: string;
    body: Buffer | string;
    contentType?: string;
    metadata?: Record<string, string>;
}

type S3Error = {
    name?: string;
    $metadata?: {
        httpStatusCode?: number;
    };
};

function isObjectNotFoundError(error: unknown): boolean {
    if (typeof error !== 'object' || error === null) {
        return false;
    }

    const { name, $metadata } = error as S3Error;

    return name === 'NoSuchKey' || name === 'NotFound' || $metadata?.httpStatusCode === 404;
}

export async function uploadFile(options: UploadFileOptions): Promise<void> {
    const { bucket, key, body, contentType, metadata } = options;

    await s3.send(
        new PutObjectCommand({
            Bucket: bucket,
            Key: key,
            Body: body,
            ...(contentType !== undefined && { ContentType: contentType }),
            ...(metadata !== undefined && { Metadata: metadata }),
        }),
    );
}

export async function deleteFile(bucket: Bucket | string, key: string): Promise<void> {
    await s3.send(
        new DeleteObjectCommand({
            Bucket: bucket,
            Key: key,
        }),
    );
}

export async function fileExists(bucket: Bucket | string, key: string): Promise<boolean> {
    try {
        await s3.send(
            new HeadObjectCommand({
                Bucket: bucket,
                Key: key,
            }),
        );

        return true;
    } catch (error) {
        if (isObjectNotFoundError(error)) {
            return false;
        }

        throw error;
    }
}

export async function getFileInfo(bucket: Bucket | string, key: string): Promise<HeadObjectCommandOutput> {
    try {
        return await s3.send(
            new HeadObjectCommand({
                Bucket: bucket,
                Key: key,
            }),
        );
    } catch (error) {
        if (isObjectNotFoundError(error)) {
            throw new Error(`Arquivo não encontrado: ${bucket}/${key}`, { cause: error });
        }

        throw error;
    }
}

export async function getSignedFileUrl(bucket: Bucket | string, key: string, expiresIn = 3600): Promise<string> {
    const command = new GetObjectCommand({ Bucket: bucket, Key: key });

    return getSignedUrl(s3, command, { expiresIn });
}

export async function getFile(bucket: Bucket | string, key: string): Promise<GetObjectCommandOutput['Body']> {
    try {
        const data = await s3.send(
            new GetObjectCommand({
                Bucket: bucket,
                Key: key,
            }),
        );

        return data.Body;
    } catch (error) {
        if (isObjectNotFoundError(error)) {
            return undefined;
        }

        throw error;
    }
}
