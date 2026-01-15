import { NextRequest, NextResponse } from 'next/server';

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ uid: string }> }
) {
    try {
        const { uid } = await params;
        console.log(`[API] Fetching Enka data for UID: ${uid}`);

        if (!uid) {
            console.error('[API] UID is missing');
            return NextResponse.json({ error: 'UID is required' }, { status: 400 });
        }

        const response = await fetch(`https://enka.network/api/uid/${uid}`, {
            headers: {
                'User-Agent': 'GenshinBuildCardApp/1.0',
            },
        });

        if (!response.ok) {
            console.error(`[API] Enka.Network error: ${response.status} ${response.statusText}`);
            return NextResponse.json(
                { error: `Failed to fetch data from Enka.Network: ${response.statusText}` },
                { status: response.status }
            );
        }

        const data = await response.json();
        return NextResponse.json(data);
    } catch (error) {
        console.error('[API] Internal Server Error:', error);
        return NextResponse.json(
            { error: 'Internal Server Error' },
            { status: 500 }
        );
    }
}
