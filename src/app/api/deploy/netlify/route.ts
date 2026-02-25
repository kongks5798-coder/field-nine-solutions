import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";

// Netlify Deploy API integration using direct file upload

interface NetlifyDeployRequest {
  projectName: string;
  files: Record<string, string>;
  token: string; // Netlify API token
}

export async function POST(req: NextRequest) {
  try {
    const body: NetlifyDeployRequest = await req.json();
    const { projectName, files, token } = body;

    if (!token) {
      return NextResponse.json(
        { error: "Netlify API 토큰이 필요합니다" },
        { status: 400 },
      );
    }
    if (!files || Object.keys(files).length === 0) {
      return NextResponse.json(
        { error: "배포할 파일이 없습니다" },
        { status: 400 },
      );
    }

    // Step 1: Create a new site (if needed)
    const siteName = projectName
      .toLowerCase()
      .replace(/[^a-z0-9-]/g, "-")
      .slice(0, 50);

    // Step 2: Prepare file hashes for deploy
    const fileDigests: Record<string, string> = {};
    const fileContents: Record<string, string> = {};

    for (const [name, content] of Object.entries(files)) {
      const hash = crypto.createHash("sha1").update(content).digest("hex");
      // Netlify expects files relative to publish dir
      const path = name.startsWith("/") ? name : `/${name}`;
      fileDigests[path] = hash;
      fileContents[hash] = content;
    }

    // Step 3: Create site
    const deployRes = await fetch("https://api.netlify.com/api/v1/sites", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        name: siteName,
        custom_domain: null,
      }),
    });

    let siteId: string;
    if (deployRes.ok) {
      const site = await deployRes.json();
      siteId = site.id;
    } else if (deployRes.status === 422) {
      // Site name already taken, try to find it
      const listRes = await fetch(
        `https://api.netlify.com/api/v1/sites?name=${siteName}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );
      const sites = await listRes.json();
      if (Array.isArray(sites) && sites.length > 0) {
        siteId = sites[0].id;
      } else {
        return NextResponse.json(
          { error: "사이트 생성 실패" },
          { status: 422 },
        );
      }
    } else {
      return NextResponse.json(
        { error: `Netlify API 오류: ${deployRes.status}` },
        { status: deployRes.status },
      );
    }

    // Step 4: Create deploy with file digest
    const createDeployRes = await fetch(
      `https://api.netlify.com/api/v1/sites/${siteId}/deploys`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          files: fileDigests,
          draft: false,
        }),
      },
    );

    if (!createDeployRes.ok) {
      const err = await createDeployRes.json().catch(() => ({}));
      return NextResponse.json(
        { error: err.message || "Deploy creation failed" },
        { status: createDeployRes.status },
      );
    }

    const deploy = await createDeployRes.json();

    // Step 5: Upload required files
    const requiredHashes: string[] = deploy.required || [];
    for (const hash of requiredHashes) {
      const content = fileContents[hash];
      if (!content) continue;

      await fetch(
        `https://api.netlify.com/api/v1/deploys/${deploy.id}/files/${hash}`,
        {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/octet-stream",
          },
          body: content,
        },
      );
    }

    return NextResponse.json({
      success: true,
      deploymentId: deploy.id,
      url:
        deploy.ssl_url || `https://${deploy.subdomain}.netlify.app`,
      siteId,
      state: deploy.state,
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
