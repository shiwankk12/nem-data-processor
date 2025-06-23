import { NEM12ProcessorService } from "@/lib/nem12-processor";
import type { NextRequest } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File;

    // Process file
    const processor = new NEM12ProcessorService();
    const result = await processor.processFile(file);

    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error processing NEM12 file:", error);

    return new Response(
      JSON.stringify({
        error:
          error instanceof Error ? error.message : "Failed to process file",
      }),
      {
        status:
          error instanceof Error && error.message.includes("No file provided")
            ? 400
            : 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}
