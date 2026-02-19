import s3 from "@/app/lib/s3";
import { nanoid } from "nanoid";
import { NextResponse } from "next/server";

export async function POST(req) {
    try {
        const { fileName, fileType } = await req.json();
        const key = `uploads/${nanoid()}-${fileName}`;

        const uploadUrl = await s3.getSignedUrlPromise("putObject", {
            Bucket: process.env.AWS_BUCKET_NAME,
            Key: key,
            ContentType: fileType,
            Expires: 60,
        });

        return NextResponse.json({ uploadUrl, key });
    } catch (error) {
        console.error("S3 Upload Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function GET() {
    try {
        const data = await s3.listObjectsV2({
            Bucket: process.env.AWS_BUCKET_NAME,
            Prefix: 'uploads/'
        }).promise();

        const files = await Promise.all(
            (data.Contents || []).map(async (file) => {
                const url = await s3.getSignedUrlPromise("getObject", {
                    Bucket: process.env.AWS_BUCKET_NAME,
                    Key: file.Key,
                    Expires: 3600, // URL valid for 1 hour
                });
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

        await s3.deleteObject({
            Bucket: process.env.AWS_BUCKET_NAME,
            Key: key,
        }).promise();

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("S3 Delete Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
