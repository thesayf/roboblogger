import mongoose from 'mongoose';
import Series from '@/models/Series';
import TopicCluster from '@/models/TopicCluster';

export class ContentStructureError extends Error {
  status: number;

  constructor(message: string, status = 400) {
    super(message);
    this.name = 'ContentStructureError';
    this.status = status;
  }
}

function optionalObjectId(value: unknown, fieldName: string) {
  if (value === undefined || value === null || value === '') return undefined;
  if (typeof value !== 'string' || !mongoose.Types.ObjectId.isValid(value)) {
    throw new ContentStructureError(`${fieldName} must be a valid ID`);
  }
  return new mongoose.Types.ObjectId(value);
}

export function structureSlug(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 180) || 'untitled';
}

export async function uniqueOwnedSlug(
  model: mongoose.Model<any>,
  ownerId: string,
  value: string,
  excludeId?: string
) {
  const base = structureSlug(value);
  let slug = base;
  let suffix = 2;

  while (
    await model.exists({
      owner: ownerId,
      slug,
      ...(excludeId ? { _id: { $ne: excludeId } } : {}),
    })
  ) {
    slug = `${base}-${suffix}`;
    suffix += 1;
  }

  return slug;
}

export async function resolveContentStructure({
  ownerId,
  clusterId,
  seriesId,
}: {
  ownerId: string;
  clusterId?: unknown;
  seriesId?: unknown;
}) {
  let resolvedClusterId = optionalObjectId(clusterId, 'clusterId');
  const resolvedSeriesId = optionalObjectId(seriesId, 'seriesId');

  if (resolvedSeriesId) {
    const series = await Series.findOne({
      _id: resolvedSeriesId,
      owner: ownerId,
    })
      .select('clusterId')
      .lean() as { clusterId?: mongoose.Types.ObjectId } | null;

    if (!series) {
      throw new ContentStructureError('Series not found', 404);
    }

    if (series.clusterId) {
      if (resolvedClusterId && !series.clusterId.equals(resolvedClusterId)) {
        throw new ContentStructureError('The selected series belongs to a different cluster');
      }
      resolvedClusterId = series.clusterId;
    } else if (resolvedClusterId) {
      throw new ContentStructureError(
        'Attach the standalone series to the cluster before assigning clustered content to it'
      );
    }
  }

  if (resolvedClusterId) {
    const clusterExists = await TopicCluster.exists({
      _id: resolvedClusterId,
      owner: ownerId,
    });
    if (!clusterExists) {
      throw new ContentStructureError('Topic cluster not found', 404);
    }
  }

  return {
    clusterId: resolvedClusterId,
    seriesId: resolvedSeriesId,
  };
}

export function contentStructureErrorResponse(error: unknown) {
  if (error instanceof ContentStructureError) {
    return { message: error.message, status: error.status };
  }
  return null;
}
