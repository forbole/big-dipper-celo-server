// register server side methods
import "../../api/blocks/server/methods"
import "../../api/transactions/server/methods"

// create indexes
import { Blocks } from '../../api/blocks/blocks';

Blocks.rawCollection().createIndex({number: -1},{unique:true});

