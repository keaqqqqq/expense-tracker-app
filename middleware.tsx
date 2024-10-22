import { NextResponse, NextRequest } from "next/server";

export default function middleware(req: NextRequest) {
    let verify = req.cookies.get("loggedin");
    let url = req.url;

    if (!verify && url.includes('/dashboard')) {
        return NextResponse.redirect('http://localhost:3000/');
    }
}
