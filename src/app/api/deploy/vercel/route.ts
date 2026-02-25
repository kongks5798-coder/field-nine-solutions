import { NextRequest, NextResponse } from "next/server";

// Vercel Deploy API integration
// Docs: https://vercel.com/docs/rest-api/endpoints/deployments/create-a-new-deployment

interface DeployRequest {
  projectName: string;
  files: Record<string, string>;
  framework?: string;
  token: string; // Vercel API token
}

export async function POST(req: NextRequest) {
  try {
    const body: DeployRequest = await req.json();
    const { projectName, files, framework, token } = body;

    if (!token) {
      return NextResponse.json(
        { error: "Vercel API 토큰이 필요합니다" },
        { status: 400 },
      );
    }
    if (!files || Object.keys(files).length === 0) {
      return NextResponse.json(
        { error: "배포할 파일이 없습니다" },
        { status: 400 },
      );
    }

    // Convert files to Vercel format
    const vercelFiles = Object.entries(files).map(([name, content]) => ({
      file: name,
      data: Buffer.from(content).toString("base64"),
      encoding: "base64" as const,
    }));

    // Create deployment
    const response = await fetch("https://api.vercel.com/v13/deployments", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        name: projectName
          .toLowerCase()
          .replace(/[^a-z0-9-]/g, "-")
          .slice(0, 50),
        files: vercelFiles,
        projectSettings: {
          framework: framework || null,
          buildCommand: null,
          outputDirectory: null,
        },
        target: "production",
      }),
    });

    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      return NextResponse.json(
        {
          error:
            errData.error?.message ||
            `Vercel API 오류: ${response.status}`,
        },
        { status: response.status },
      );
    }

    const data = await response.json();
    return NextResponse.json({
      success: true,
      deploymentId: data.id,
      url: `https://${data.url}`,
      readyState: data.readyState,
      inspectorUrl: data.inspectorUrl,
    });
  } catch (err) {
    return NextResponse.json(
      {
        error: `배포 실패: ${err instanceof Error ? err.message : String(err)}`,
      },
      { status: 500 },
    );
  }
}

// Get deployment status
export async function GET(req: NextRequest) {
  const deploymentId = req.nextUrl.searchParams.get("id");
  const token = req.headers.get("x-vercel-token");

  if (!deploymentId || !token) {
    return NextResponse.json(
      { error: "Missing deploymentId or token" },
      { status: 400 },
    );
  }

  try {
    const response = await fetch(
      `https://api.vercel.com/v13/deployments/${deploymentId}`,
      {
        headers: { Authorization: `Bearer ${token}` },
      },
    );

    if (!response.ok) {
      return NextResponse.json(
        { error: `Status check failed: ${response.status}` },
        { status: response.status },
      );
    }

    const data = await response.json();
    return NextResponse.json({
      id: data.id,
      url: data.url ? `https://${data.url}` : null,
      readyState: data.readyState,
      state: data.state,
      createdAt: data.createdAt,
    });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
