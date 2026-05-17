// DeliveryAdapter — adapts packaged output to different delivery channels
// arc42 §5: Packaging domain — filesystem, HTTP response, message attachment

import { writeFile, mkdir } from 'node:fs/promises';
import { join, basename } from 'node:path';

/** Delivery channel type */
export type DeliveryChannel = 'filesystem' | 'http-response' | 'message-attachment';

/** Result of a delivery operation */
export interface DeliveryResult {
  channel: DeliveryChannel;
  success: boolean;
  location: string;
  message: string;
  /** Size in bytes of the delivered content */
  sizeBytes: number;
}

/** Filesystem delivery options */
export interface FilesystemDeliveryOptions {
  channel: 'filesystem';
  outputDir: string;
  filename?: string;
  overwrite?: boolean;
}

/** HTTP response delivery options (produces response-ready payload) */
export interface HttpDeliveryOptions {
  channel: 'http-response';
  /** Content-Disposition filename */
  filename?: string;
}

/** Message attachment delivery options (produces attachment-ready payload) */
export interface MessageDeliveryOptions {
  channel: 'message-attachment';
  /** Target channel identifier (e.g., feishu user ID, webhook URL) */
  target: string;
  filename?: string;
}

export type DeliveryOptions =
  | FilesystemDeliveryOptions
  | HttpDeliveryOptions
  | MessageDeliveryOptions;

/** HTTP-ready response payload */
export interface HttpResponsePayload {
  statusCode: number;
  headers: Record<string, string>;
  body: Buffer;
}

/** Message-ready attachment payload */
export interface MessageAttachmentPayload {
  target: string;
  filename: string;
  contentType: string;
  data: Buffer;
}

/**
 * DeliveryAdapter routes packaged content to the appropriate delivery channel.
 * Each channel produces a different output format suitable for its consumer.
 */
export class DeliveryAdapter {
  /**
   * Deliver content to the specified channel.
   */
  async deliver(content: Buffer, contentType: string, options: DeliveryOptions): Promise<DeliveryResult> {
    switch (options.channel) {
      case 'filesystem':
        return this.deliverToFilesystem(content, options);
      case 'http-response':
        return this.deliverAsHttpResponse(content, contentType, options);
      case 'message-attachment':
        return this.deliverAsAttachment(content, contentType, options);
    }
  }

  /**
   * Prepare an HTTP response payload without actually sending it.
   * Useful for integration with web frameworks.
   */
  prepareHttpResponse(content: Buffer, contentType: string, filename?: string): HttpResponsePayload {
    const headers: Record<string, string> = {
      'Content-Type': contentType,
      'Content-Length': String(content.length),
      'Cache-Control': 'no-cache',
    };

    if (filename) {
      headers['Content-Disposition'] = `attachment; filename="${filename}"`;
    }

    return { statusCode: 200, headers, body: content };
  }

  /**
   * Prepare a message attachment payload without actually sending it.
   * Consumers (Host Adapters) handle the actual delivery to messaging platforms.
   */
  prepareAttachment(content: Buffer, contentType: string, target: string, filename: string): MessageAttachmentPayload {
    return { target, filename, contentType, data: content };
  }

  private async deliverToFilesystem(content: Buffer, options: FilesystemDeliveryOptions): Promise<DeliveryResult> {
    await mkdir(options.outputDir, { recursive: true });
    const filename = options.filename ?? 'output.html';
    const outputPath = join(options.outputDir, filename);

    await writeFile(outputPath, content);

    return {
      channel: 'filesystem',
      success: true,
      location: outputPath,
      message: `Written to ${outputPath}`,
      sizeBytes: content.length,
    };
  }

  private async deliverAsHttpResponse(content: Buffer, contentType: string, options: HttpDeliveryOptions): Promise<DeliveryResult> {
    // Prepare the response payload — actual HTTP sending is handled by the host framework
    const payload = this.prepareHttpResponse(content, contentType, options.filename);
    const location = options.filename ?? 'response-body';

    return {
      channel: 'http-response',
      success: true,
      location,
      message: `HTTP response prepared (${payload.headers['Content-Type']}, ${content.length} bytes)`,
      sizeBytes: content.length,
    };
  }

  private async deliverAsAttachment(content: Buffer, contentType: string, options: MessageDeliveryOptions): Promise<DeliveryResult> {
    // Prepare the attachment payload — actual messaging is handled by the Host Adapter
    const filename = options.filename ?? 'attachment';
    this.prepareAttachment(content, contentType, options.target, filename);

    return {
      channel: 'message-attachment',
      success: true,
      location: `${options.target}/${filename}`,
      message: `Attachment prepared for ${options.target} (${content.length} bytes)`,
      sizeBytes: content.length,
    };
  }
}
