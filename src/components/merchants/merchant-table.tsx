"use client";

import { Merchant } from "@/types/merchant";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Eye, Edit, Trash2 } from "lucide-react";
import Link from "next/link";
import { useMerchantsStore } from "@/lib/stores/merchants.store";

interface MerchantTableProps {
  merchants: Merchant[];
}

export function MerchantTable({ merchants }: MerchantTableProps) {
  const { deleteMerchant } = useMerchantsStore();

  const handleDelete = (id: string, name: string) => {
    if (confirm(`¿Está seguro de eliminar el merchant "${name}"?`)) {
      deleteMerchant(id);
    }
  };

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Nombre</TableHead>
            <TableHead>Código</TableHead>
            <TableHead>Países</TableHead>
            <TableHead>Estado</TableHead>
            <TableHead>Balance Eval.</TableHead>
            <TableHead className="text-right">Acciones</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {merchants.length === 0 ? (
            <TableRow>
              <TableCell colSpan={6} className="text-center text-muted-foreground">
                No hay merchants registrados
              </TableCell>
            </TableRow>
          ) : (
            merchants.map((merchant) => (
              <TableRow key={merchant.id}>
                <TableCell className="font-medium">{merchant.name}</TableCell>
                <TableCell>
                  <code className="rounded bg-gray-100 px-2 py-1 text-sm">
                    {merchant.code}
                  </code>
                </TableCell>
                <TableCell>
                  <div className="flex gap-1">
                    {merchant.countries.map((country) => (
                      <Badge key={country} variant="outline">
                        {country}
                      </Badge>
                    ))}
                  </div>
                </TableCell>
                <TableCell>
                  <Badge variant={merchant.isActive ? "success" : "destructive"}>
                    {merchant.isActive ? "Activo" : "Inactivo"}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Badge
                    variant={
                      merchant.balanceEvaluationEnabled ? "default" : "secondary"
                    }
                  >
                    {merchant.balanceEvaluationEnabled ? "Habilitado" : "Deshabilitado"}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    <Link href={`/dashboard/merchants/${merchant.id}`}>
                      <Button variant="ghost" size="icon" title="Ver detalles">
                        <Eye className="h-4 w-4" />
                      </Button>
                    </Link>
                    <Link href={`/dashboard/merchants/${merchant.id}/edit`}>
                      <Button variant="ghost" size="icon" title="Editar">
                        <Edit className="h-4 w-4" />
                      </Button>
                    </Link>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDelete(merchant.id, merchant.name)}
                      title="Eliminar"
                    >
                      <Trash2 className="h-4 w-4 text-red-500" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}
