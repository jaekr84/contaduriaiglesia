import { getUsers } from './actions'
import { UsersList } from './components/UsersList'
import { getAppUrl } from '@/lib/utils'

export default async function UsersPage() {
    const { profiles, invitations, currentUserId } = await getUsers()
    const appUrl = getAppUrl()

    return (
        <UsersList
            profiles={profiles}
            invitations={invitations}
            currentUserId={currentUserId}
            appUrl={appUrl}
        />
    )
}
