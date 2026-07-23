import { HttpStatus } from '@nestjs/common';
import { ApiException } from '../../../common/errors/api-exception.js';

export const bucketListNotFound = () =>
  new ApiException(
    HttpStatus.NOT_FOUND,
    'BUCKET_LIST_NOT_FOUND',
    'Roční seznam nebyl nalezen.',
  );

export const bucketListItemNotFound = () =>
  new ApiException(
    HttpStatus.NOT_FOUND,
    'BUCKET_LIST_ITEM_NOT_FOUND',
    'Položka seznamu nebyla nalezena.',
  );

export const invalidBucketList = (message: string) =>
  new ApiException(HttpStatus.BAD_REQUEST, 'BUCKET_LIST_INVALID', message);

export const bucketListConflict = (message: string) =>
  new ApiException(HttpStatus.CONFLICT, 'BUCKET_LIST_CONFLICT', message);
