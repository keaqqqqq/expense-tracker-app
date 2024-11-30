import { NextResponse, NextRequest } from "next/server";

export default function middleware(req: NextRequest) {
    const verify = req.cookies.get("loggedin");
    const url = req.url;

    if (!verify && url.includes('/dashboard')) {
        return NextResponse.redirect('http://localhost:3000/');
    }
}
