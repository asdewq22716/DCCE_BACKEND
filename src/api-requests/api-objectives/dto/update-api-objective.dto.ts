import { PartialType } from '@nestjs/swagger';
import { CreateApiObjectiveDto } from './create-api-objective.dto';

export class UpdateApiObjectiveDto extends PartialType(CreateApiObjectiveDto) {}
