async function loadApplications() {

    const res = await fetch("/applications")
    const data = await res.json()

    const table = document.getElementById("applications")

    data.forEach(app => {

        table.innerHTML += `
<tr>
<td>${app.name}</td>
<td>${app.email}</td>
<td>${app.domain}</td>
<td>${app.message}</td>
</tr>
`

    })

}

async function loadTickets() {

    const res = await fetch("/tickets")
    const data = await res.json()

    const table = document.getElementById("tickets")

    data.forEach(ticket => {

        table.innerHTML += `
<tr>
<td>${ticket.ticketId}</td>
<td>${ticket.name}</td>
<td>${ticket.email}</td>
<td>${ticket.status}</td>
</tr>
`

    })

}

loadApplications()
loadTickets()