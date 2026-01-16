import { getUsers } from './actions'
import { UsersList } from './components/UsersList'

export default async function UsersPage() {
    const { profiles, invitations } = await getUsers()

    return (
        <UsersList
            profiles={profiles}
            invitations={invitations}
        />
    )
}
