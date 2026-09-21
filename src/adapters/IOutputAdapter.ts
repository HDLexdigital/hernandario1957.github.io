import { C01_03_ContractMultisource } from '../contracts/C01-03-multisource';
import { ContractFormat, IVirtualFileSystem } from '../contracts/MVP-057-transaction';

export interface IOutputAdapter {
  readonly formatId: ContractFormat;
  process(
    contract: C01_03_ContractMultisource, 
    vfs: IVirtualFileSystem,
    abortSignal: AbortSignal
  ): Promise<void>;
}
