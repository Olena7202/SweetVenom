import { normalizeStatus, statusLabel } from "../utils/orderViewModel";
const steps=["Pending","Accepted","InProgress","Ready","Delivered"];
export default function OrderProgress({status}) {
  const normalized=normalizeStatus(status);
  const current=steps.indexOf(normalized);
  if(normalized==="Cancelled") return <p className="order-cancelled">Замовлення скасовано.</p>;
  return <ol className="order-progress" aria-label="Етапи замовлення">{steps.map((step,index)=><li key={step} className={index<current?"is-complete":index===current?"is-current":""} aria-current={index===current?"step":undefined}><span aria-hidden="true">{index<current?"✓":index+1}</span>{statusLabel(step)}</li>)}</ol>;
}
