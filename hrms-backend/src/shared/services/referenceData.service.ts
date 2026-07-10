import { Document, Model } from "mongoose";
import { ApiError } from "../errors/ApiError";

export interface NamedActiveDoc extends Document {
  name: string;
  isActive: boolean;
}

export function listReferenceData<T extends NamedActiveDoc>(
  model: Model<T>,
  includeInactive: boolean
) {
  const filter = includeInactive ? {} : { isActive: true };
  return model.find(filter).sort({ name: 1 });
}

export async function createReferenceData<T extends NamedActiveDoc>(
  model: Model<T>,
  name: string,
  label: string
): Promise<T> {
  const existing = await model.findOne({ name });
  if (existing) {
    throw new ApiError(409, `${label} "${name}" already exists`);
  }
  return model.create({ name, isActive: true } as never);
}

export async function updateReferenceData<T extends NamedActiveDoc>(
  model: Model<T>,
  id: string,
  name: string,
  label: string
): Promise<T> {
  const doc = await model.findById(id);
  if (!doc) {
    throw new ApiError(404, `${label} not found`);
  }

  if (name !== doc.name) {
    const existing = await model.findOne({ name });
    if (existing) {
      throw new ApiError(409, `${label} "${name}" already exists`);
    }
  }

  doc.name = name;
  await doc.save();
  return doc;
}

export async function setReferenceDataActive<T extends NamedActiveDoc>(
  model: Model<T>,
  id: string,
  isActive: boolean,
  label: string
): Promise<T> {
  const doc = await model.findByIdAndUpdate(id, { isActive }, { new: true });
  if (!doc) {
    throw new ApiError(404, `${label} not found`);
  }
  return doc;
}
