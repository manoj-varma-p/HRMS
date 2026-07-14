import { Request, Response, NextFunction } from "express";
import { getObjectBuffer } from "../../shared/services/s3.client";
import { COMPANY_LOGO_S3_KEY } from "../configuration/configuration.service";
import { getCompanyProfile } from "../configuration/configuration.cache";
import { sendSuccess } from "../../shared/utils/ApiResponse";

// Just the two fields the app chrome needs before/regardless of role —
// name and whether a logo exists. Everything else in Configuration
// (leave policy, security settings, email settings, ...) stays behind the
// admin-only GET /configuration; this route intentionally can't leak any
// of that.
export function getCompanyBranding(_req: Request, res: Response): void {
  const { name, logoUrl } = getCompanyProfile();
  sendSuccess(res, { name, logoUrl });
}

// Intentionally unauthenticated — a company logo is meant to be visible in
// the app chrome to anyone using it, and this is the ONLY thing this app
// ever serves straight out of S3 without a signed URL or an auth check.
// The bucket itself stays fully private; this route reads the one fixed
// object server-side (with our own IAM credentials) and streams the bytes
// through — no S3 URL, signed or otherwise, is ever exposed to a client.
export async function getCompanyLogo(
  _req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const object = await getObjectBuffer(COMPANY_LOGO_S3_KEY);
    if (!object) {
      res.status(404).end();
      return;
    }
    res.setHeader("Content-Type", object.contentType);
    res.setHeader("Cache-Control", "public, max-age=300");
    // Helmet's default Cross-Origin-Resource-Policy is same-origin, which
    // would block the frontend (a different origin in dev, and typically a
    // different subdomain in production) from ever rendering this in an
    // <img> tag. This is the one deliberately cross-origin-embeddable
    // route in the app — every other response keeps Helmet's strict
    // default untouched.
    res.setHeader("Cross-Origin-Resource-Policy", "cross-origin");
    res.send(object.body);
  } catch (err) {
    next(err);
  }
}
