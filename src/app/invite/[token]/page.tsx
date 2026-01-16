import { getInvitation } from './actions'
import InvitationForm from './components/InvitationForm'

interface Props {
    params: Promise<{
        token: string
    }>
}

export default async function InvitePage({ params }: Props) {
    const { token } = await params
    const invitation = await getInvitation(token)

    return <InvitationForm token={token} dbInvitation={invitation} />
}
