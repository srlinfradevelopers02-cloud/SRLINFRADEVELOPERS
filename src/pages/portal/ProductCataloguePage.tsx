import ProductCatalog from './ProductCatalog';
import { usePortalStaff } from '../../components/portal/PortalLayout';
import { isAdminRole } from '../../lib/permissions';

/*
 * Product Catalogue for every signed-in staff member.
 * Admins can edit prices, photos and publishing; staff can browse.
 */
export default function ProductCataloguePage() {
  const staff = usePortalStaff();

  return (
    <div className="bg-gray-50 p-4 md:p-8">
      <div className="mx-auto max-w-7xl">
        <ProductCatalog canEdit={isAdminRole(staff)} />
      </div>
    </div>
  );
}
