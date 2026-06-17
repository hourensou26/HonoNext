import README from '@/markdown/README.mdx'
import { CustomTh } from '@/shared/components/Mdx/markdownComponents';
 
const overrideComponents = {
  th: CustomTh,
}
 
export default function Page() {
  return <README components={overrideComponents} />
}