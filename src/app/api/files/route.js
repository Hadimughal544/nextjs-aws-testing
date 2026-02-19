import s3Client from "@/app/lib/s3";
import {
    PutObjectCommand,
    ListObjectsV2Command,
    DeleteObjectCommand,
    GetObjectCommand
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { nanoid } from "nanoid";
import { NextResponse } from "next/server";

export async function POST(req) {
    try {
        const { fileName, fileType } = await req.json();
        const key = `uploads/${nanoid()}-${fileName}`;

        const command = new PutObjectCommand({
            Bucket: process.env.AWS_BUCKET_NAME,
            Key: key,
            ContentType: fileType,
        });

        const uploadUrl = await getSignedUrl(s3Client, command, { expiresIn: 60 });

        return NextResponse.json({ uploadUrl, key });
    } catch (error) {
        console.error("S3 Upload Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function GET() {
    try {
        const command = new ListObjectsV2Command({
            Bucket: process.env.AWS_BUCKET_NAME,
            Prefix: 'uploads/'
        });

        const data = await s3Client.send(command);

        const files = await Promise.all(
            (data.Contents || []).map(async (file) => {
                const getCommand = new GetObjectCommand({
                    Bucket: process.env.AWS_BUCKET_NAME,
                    Key: file.Key,
                });
                const url = await getSignedUrl(s3Client, getCommand, { expiresIn: 3600 });
                return { ...file, url };
            })
        );

        return NextResponse.json(files);
    } catch (error) {
        console.error("S3 List Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}


export async function DELETE(req) {
    try {
        const { key } = await req.json();

        const command = new DeleteObjectCommand({
            Bucket: process.env.AWS_BUCKET_NAME,
            Key: key,
        });

        await s3Client.send(command);

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("S3 Delete Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
