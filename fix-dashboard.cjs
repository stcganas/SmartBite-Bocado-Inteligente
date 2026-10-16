const fs = require('fs');
let code = fs.readFileSync('src/pages/AdminDashboard.tsx', 'utf8');
const lines = code.split('\n');

// Find line 2223 index (0-based is 2222)
// Line 2223 is: <div className="text-right shrink-0">
// Line 2264 is: </div> closing it

// Find line 2403 index (0-based is 2402)
// Line 2403 is: </div>
// Line 2404 is: </div>
// Line 2405 is: <div className="text-right flex flex-col items-end gap-2">
// Line 2462 is: </div>

const part1 = lines.slice(0, 2222); // up to line 2222
const part2 = lines.slice(2265, 2402); // 2266 to 2402
const part3 = lines.slice(2462); // 2463 onwards

const sectionRight = `
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

const newLines = [...part1, ...sectionRight.trim('\n').split('\n'), ...part2, ...part3];

fs.writeFileSync('src/pages/AdminDashboard.tsx', newLines.join('\n'));
console.log('Fixed');
