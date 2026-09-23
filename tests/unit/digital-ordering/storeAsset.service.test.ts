import { beforeEach, describe, expect, it, vi } from "vitest";
const getSession = vi.fn();
const rpc = vi.fn();
const uploadProductImage = vi.fn();
const deleteProductImage = vi.fn();
const convertImageToWebp = vi.fn();

vi.mock("@/config/supabase", () => ({
  supabase: {
    auth: { getSession },
    rpc,
  },
}));

vi.mock("@/features/products/repository/productImage.repository", () => ({
  PRODUCT_IMAGE_MAX_BYTES: 3 * 1024 * 1024,
  PRODUCT_IMAGES_BUCKET: "product-images",
  uploadProductImage: (...args: unknown[]) => uploadProductImage(...args),
  deleteProductImage: (...args: unknown[]) => deleteProductImage(...args),
  getProductImageUrl: (path: string) => `https://cdn.test/${path}`,
}));

vi.mock("@/features/products/utils/convertImageToWebp", () => ({
  convertImageToWebp: (...args: unknown[]) => convertImageToWebp(...args),
}));

const ORG_A = "11111111-1111-4111-8111-111111111111";
const ORG_B = "22222222-2222-4222-8222-222222222222";

function jpegFile(name = "logo.jpg", size = 32) {
  const bytes = new Uint8Array(Math.max(size, 12));
  bytes[0] = 0xff;
  bytes[1] = 0xd8;
  bytes[2] = 0xff;
  return new File([bytes], name, { type: "image/jpeg" });
}

async function loadService() {
  return import("@/features/digital-ordering/menu/admin/editor/storeAsset.service");
}

describe("store asset validation", () => {
  it("rejects invalid MIME, extension, magic bytes and oversized files", async () => {
    const {
      validateStoreAssetFile,
      assertImageMagicBytes,
      STORE_ASSET_MAX_DIMENSION,
    } = await loadService();

    expect(STORE_ASSET_MAX_DIMENSION.logo).toBe(800);
    expect(STORE_ASSET_MAX_DIMENSION.banner).toBe(1600);

    expect(() =>
      validateStoreAssetFile(
        new File([new Uint8Array([1])], "logo.gif", { type: "image/gif" })
      )
    ).toThrow(/JPG, PNG ou WebP/);

    expect(() =>
      validateStoreAssetFile(
        new File([new Uint8Array([1])], "logo.exe", { type: "image/jpeg" })
      )
    ).toThrow(/JPG, PNG ou WebP/);

    await expect(
      assertImageMagicBytes(
        new File([new Uint8Array([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12])], "logo.jpg", {
          type: "image/jpeg",
        })
      )
    ).rejects.toThrow(/não parece uma imagem/);

    const oversized = new File(
      [new Uint8Array(3 * 1024 * 1024 + 1)],
      "logo.jpg",
      { type: "image/jpeg" }
    );
    expect(() => validateStoreAssetFile(oversized)).toThrow(/3 MB/);
  });
});

describe("store asset upload isolation", () => {
  beforeEach(() => {
    getSession.mockReset();
    rpc.mockReset();
    uploadProductImage.mockReset();
    deleteProductImage.mockReset();
    convertImageToWebp.mockReset();
    convertImageToWebp.mockResolvedValue(new Blob([new Uint8Array([1])], { type: "image/webp" }));
    uploadProductImage.mockResolvedValue({ path: "ok" });
    deleteProductImage.mockResolvedValue(undefined);
    getSession.mockResolvedValue({
      data: { session: { access_token: "token", user: { id: "user-a" } } },
      error: null,
    });
    rpc.mockResolvedValue({ data: ORG_A, error: null });
  });

  it("uploads only under the authenticated org /store path with nonce and dimension cap", async () => {
    const { uploadStoreAsset } = await loadService();
    const result = await uploadStoreAsset({
      organizationId: ORG_A,
      kind: "logo",
      file: jpegFile(),
    });

    expect(convertImageToWebp).toHaveBeenCalledWith(
      expect.any(File),
      { maxDimension: 800 }
    );
    expect(uploadProductImage).toHaveBeenCalledTimes(1);
    const path = uploadProductImage.mock.calls[0][0] as string;
    expect(path.startsWith(`${ORG_A}/store/logo-`)).toBe(true);
    expect(path.endsWith(".webp")).toBe(true);
    expect(path).toMatch(/logo-\d+-[a-f0-9]+\.webp$/);
    expect(result.publicUrl).toBe(`https://cdn.test/${path}`);

    await uploadStoreAsset({
      organizationId: ORG_A,
      kind: "banner",
      file: jpegFile("banner.jpg"),
    });
    expect(convertImageToWebp).toHaveBeenLastCalledWith(
      expect.any(File),
      { maxDimension: 1600 }
    );
  });

  it("blocks upload/delete targeted at another organization", async () => {
    const { uploadStoreAsset, removeStoreAsset } = await loadService();

    await expect(
      uploadStoreAsset({
        organizationId: ORG_B,
        kind: "logo",
        file: jpegFile(),
      })
    ).rejects.toMatchObject({
      code: "ORG_FORBIDDEN",
    });
    expect(uploadProductImage).not.toHaveBeenCalled();

    await removeStoreAsset(
      `https://x.supabase.co/storage/v1/object/public/product-images/${ORG_B}/store/logo-1-aa.webp`,
      ORG_A
    );
    expect(deleteProductImage).not.toHaveBeenCalled();
  });

  it("deletes the new object when cancel happens after upload, and only then removes the previous own asset", async () => {
    const { uploadStoreAsset } = await loadService();
    const controller = new AbortController();
    uploadProductImage.mockImplementation(async () => {
      controller.abort();
      return { path: "ok" };
    });

    await expect(
      uploadStoreAsset({
        organizationId: ORG_A,
        kind: "logo",
        file: jpegFile(),
        previousUrl: `https://x.supabase.co/storage/v1/object/public/product-images/${ORG_A}/store/logo-old-aa.webp`,
        signal: controller.signal,
      })
    ).rejects.toMatchObject({ code: "UPLOAD_CANCELLED" });

    expect(deleteProductImage).toHaveBeenCalledTimes(1);
    const deleted = deleteProductImage.mock.calls[0][0] as string;
    expect(deleted.startsWith(`${ORG_A}/store/logo-`)).toBe(true);
    expect(deleted).not.toContain("logo-old-aa");
  });

  it("removes the previous own store asset only after a confirmed replacement", async () => {
    const { uploadStoreAsset } = await loadService();
    const previous =
      `https://x.supabase.co/storage/v1/object/public/product-images/${ORG_A}/store/logo-old-aa.webp`;

    await uploadStoreAsset({
      organizationId: ORG_A,
      kind: "logo",
      file: jpegFile(),
      previousUrl: previous,
    });

    expect(uploadProductImage).toHaveBeenCalledTimes(1);
    expect(deleteProductImage).toHaveBeenCalledWith(
      `${ORG_A}/store/logo-old-aa.webp`
    );
  });
});
