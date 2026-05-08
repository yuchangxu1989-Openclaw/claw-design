// Packaging module — full implementation
// Components: PackagingEngine, AssetBundler, MetadataInjector, DeliveryAdapter
// Plus legacy: DefaultPackagingService, PdfExporter, ImageExporter

export { DefaultPackagingService } from './packaging-service.js';
export type { PackagingService, PackagingOptions } from './packaging-service.js';
export { PdfExporter } from './pdf-exporter.js';
export type { PdfExportResult } from './pdf-exporter.js';
export { ImageExporter } from './image-exporter.js';
export type { ImageExportResult } from './image-exporter.js';

// Full packaging pipeline
export { PackagingEngine } from './packaging-engine.js';
export type { PackagingConfig, PackageFormat, PackageResult } from './packaging-engine.js';
export { AssetBundler } from './asset-bundler.js';
export type { BundleOptions, ResolvedAsset } from './asset-bundler.js';
export { MetadataInjector } from './metadata-injector.js';
export type { PackageMetadata } from './metadata-injector.js';
export { DeliveryAdapter } from './delivery-adapter.js';
export type {
  DeliveryChannel, DeliveryResult, DeliveryOptions,
  FilesystemDeliveryOptions, HttpDeliveryOptions, MessageDeliveryOptions,
  HttpResponsePayload, MessageAttachmentPayload,
} from './delivery-adapter.js';
