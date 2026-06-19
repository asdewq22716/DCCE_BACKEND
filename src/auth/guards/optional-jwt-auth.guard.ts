import { Injectable, ExecutionContext } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class OptionalJwtAuthGuard extends AuthGuard('jwt') {
  override handleRequest(err: any, user: any, info: any, context: ExecutionContext) {
    // Return the user if authentication succeeds, otherwise return null instead of throwing an error
    if (err || !user) {
      return null;
    }
    return user;
  }
}
