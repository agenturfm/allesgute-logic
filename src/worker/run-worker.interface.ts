/*!
 * Copyright florianmatthias o.G. 2019 - All rights reserved
 */

import { InputMessage, OutputMessage } from './shared/message.class';
import { Observable } from 'rxjs';

export interface Runner {

  run< IN, OUT > ( input: InputMessage< IN > ): Observable< OutputMessage< OUT > >;

}
