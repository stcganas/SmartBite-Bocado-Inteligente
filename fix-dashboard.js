const fs = require('fs');
let code = fs.readFileSync('src/pages/AdminDashboard.tsx', 'utf8');

const lines = code.split('\n');

// 2223 is `<div className="text-right shrink-0">`
// 2462 is the end of the second status badge section

let startIdx = 2222;
let endIdx = 2461;

const newSection = `
                              <div className="text-right flex flex-col items-end gap-2">
                                <div>
                                  {!order.isWaiterCalled && (
                                    <>
                                      <p className="font-black text-orange-600">
                                        {formatCurrency(order.total)}
                                      </p>
                                      {(order.tipAmount || 0) > 0 && (
                                        <p className="text-[9px] font-bold text-emerald-600">
                                          Propina: {formatCurrency(order.tipAmount || 0)}
                                          {order.tipPercentage && \` (\${order.tipPercentage}%)\`}
                                        </p>
                                      )}
                                    </>
                                  )}
                                  <span
                                    className={\`text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full \${
                                      order.status === "pending"
                                        ? "bg-amber-100 text-amber-600"
                                        : order.status === "approved" ||
                                            order.status === "accepted"
                                          ? "bg-blue-100 text-blue-600"
                                          : order.status === "preparing"
                                            ? "bg-purple-100 text-purple-600"
                                            : order.status === "shipped" ||
                                                order.status === "on_the_way"
                                              ? "bg-orange-100 text-orange-600"
                                              : order.status === "assigned"
                                                ? "bg-indigo-100 text-indigo-600"
                                                : order.status === "completed"
                                                  ? "bg-emerald-100 text-emerald-600"
                                                  : "bg-surface-variant text-on-surface-muted"
                                    }\`}
                                  >
                                    {order.isWaiterCalled
                                      ? "Llamado"
                                      : order.status === "pending"
                                        ? "Pendiente"
                                        : order.status === "approved" ||
                                            order.status === "accepted"
                                          ? "Aprobado"
                                          : order.status === "preparing"
                                            ? "Preparando"
                                            : order.status === "shipped" ||
                                                order.status === "on_the_way"
                                              ? "Enviado"
                                              : order.status === "assigned"
                                                ? "Asignado"
                                                : order.status === "completed"
                                                  ? "Completado"
                                                  : order.status === "rejected"
                                                    ? "Rechazado"
                                                    : order.status}
                                  </span>
                                </div>
                              </div>
                            </div>
`;

// However, I want to preserve 2266 to 2402 (the details and products)
// So I will just replace the first `text-right` with the new section
// AND THEN delete the second `text-right` section at 2405-2461.
// Also delete the rogue `</div>` at 2403 and 2404.

// Wait, doing this via script might be complicated.
