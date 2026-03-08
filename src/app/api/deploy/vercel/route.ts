import { NextRequest, NextResponse } from "next/server";

// Vercel Deploy API integration
// Docs: https://vercel.com/docs/rest-api/endpoints/deployments/create-a-new-deployment
// Requires VERCEL_TOKEN in .env.local

interface DeployRequest {
  projectName: string;
  files: Record<string, string>;
  framework?: string;
  projectId?: string; // optional — for logging only
}

export async function POST(req: NextRequest) {
  const token = process.env.VERCEL_TOKEN;
  if (!token) {
    return NextResponse.json(
      { error: "VERCEL_TOKEN 환경변수가 설정되지 않았습니다" },
      { status: 500 },
    );
  }

  try {
    const body: DeployRequest = await req.json();
    const { projectName, files, framework } = body;

    if (!projectName) {
      return NextResponse.json(
        { error: "projectName이 필요합니다" },
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
            (errData as { error?: { message?: string } }).error?.message ||
            `Vercel API 오류: ${response.status}`,
        },
        { status: response.status },
      );
    }

    const data = await response.json() as { id: string; url: string; readyState: string; inspectorUrl?: string };
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
// Requires VERCEL_TOKEN in .env.local
export async function GET(req: NextRequest) {
  const deploymentId = req.nextUrl.searchParams.get("id");
  const token = process.env.VERCEL_TOKEN;

  if (!deploymentId) {
    return NextResponse.json(
      { error: "Missing deploymentId" },
      { status: 400 },
    );
  }
  if (!token) {
    return NextResponse.json(
      { error: "VERCEL_TOKEN 환경변수가 설정되지 않았습니다" },
      { status: 500 },
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

    const data = await response.json() as { id: string; url?: string; readyState: string; state?: string; createdAt: number };
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
