import {display_toast} from '../toaster.js'
const { ref } = Vue
export default {
    delimiters: ['[[', ']]'],
	props: {
		cases_info: Object
	},
	setup(props) {
        const orgs = ref([])
		
        async function fetch_orgs(){
            const res = await fetch("/case/get_orgs")
            if(await res.status==404 ){
                display_toast(res)
            }else{
                let loc = await res.json()
                orgs.value = loc
            }
        }
        fetch_orgs()

		async function remove_org_case(cases_info, org){
            const res = await fetch('/case/' + cases_info.case.id + '/remove_org/' + org.id)
            if (await res.status == 200){
                let index = cases_info.orgs_in_case.indexOf(org)
                if(index > -1)
                    cases_info.orgs_in_case.splice(index, 1)
            }
            display_toast(res)
        }

        function check_org_not_in(org_id){
            for(let i in props.cases_info.orgs_in_case){
                if(props.cases_info.orgs_in_case[i].id == org_id){
                    return true
                }
            }
            return false
        }

        async function submit_add_orgs(){
            $("#add_orgs_error").text("")
            if($("#add_orgs_select").val().includes("None") || !$("#add_orgs_select").val().length){
                $("#add_orgs_error").text("Give me more")
            }else{
                const res = await fetch('/case/' + props.cases_info.case.id + '/add_orgs',{
                    headers: { "X-CSRFToken": $("#csrf_token").val(), "Content-Type": "application/json" },
                    method: "POST",
                    body: JSON.stringify({"org_id": $("#add_orgs_select").val()})
                })
                if(await res.status == 200){
                    let loc = $("#add_orgs_select").val()
                    for(let index in loc){
                        for(let i in orgs.value){
                            if(orgs.value[i].id == loc[index]){
                                props.cases_info.orgs_in_case.push(orgs.value[i])
                            }
                        }
                    }
                    var myModalEl = document.getElementById('add_orgs');
                    var modal = bootstrap.Modal.getInstance(myModalEl)
                    modal.hide();
                }
                display_toast(res)
            }
        }

        async function submit_change_owner(){
            $("#change_owner_error").text("")
            if($("#change_owner_select").val() == "None" || !$("#change_owner_select")){
                $("#change_owner_error").text("Give me more")
            }else{
                const res = await fetch('/case/' + props.cases_info.case.id  + '/change_owner',{
                    headers: { "X-CSRFToken": $("#csrf_token").val(), "Content-Type": "application/json" },
                    method: "POST",
                    body: JSON.stringify({"org_id": $("#change_owner_select").val()})
                })
                if(await res.status == 200){
                    props.cases_info.case.owner_org_id=$("#change_owner_select").val()
                }
                display_toast(res)
            }
        }
        

		return {
            orgs,
			remove_org_case,
            check_org_not_in,
            submit_add_orgs,
            submit_change_owner
		}
    },
	template: `
		<div id="assign" style="float: right;" v-if="cases_info">
            <div class="dropdown" id="dropdown_user_case">
                <button class="btn btn-secondary dropdown-toggle" style="margin-top: -2px" data-bs-toggle="dropdown" aria-expanded="false">
                    Orgs
                    <span class="badge text-bg-primary">[[cases_info.orgs_in_case.length]]</span>
                </button>
                <ul class="dropdown-menu">
                    <template v-if="!cases_info.permission.read_only && cases_info.present_in_case || cases_info.permission.admin">
                        <li>
                            <div class="justify-content-center" style="display: flex;">
                                <button class="btn btn-primary btn-sm" title="Add an org to the case" style="margin-right: 3px" data-bs-toggle="modal" data-bs-target="#add_orgs">
                                    <i class="fa-solid fa-users"></i>+
                                </button>
                                <button class="btn btn-primary btn-sm" title="Change owner of the case" data-bs-toggle="modal" data-bs-target="#change_owner">
                                    <i class="fa-solid fa-user-pen"></i>
                                </button>
                            </div>
                        </li>
                        <li><hr class="dropdown-divider"></li>
                    </template>
                    <template v-for="org in cases_info.orgs_in_case" :key="org.id">
                        <li>
                            <div style="display: flex;">
                                <button class="dropdown-item">[[org.name]]</button>
                                <template v-if="org.id != cases_info.case.owner_org_id">
                                    <button class="btn btn-danger btn-sm" style="margin-right: 5px;" @click="remove_org_case(cases_info, org)" v-if="!cases_info.permission.read_only && cases_info.present_in_case || cases_info.permission.admin">Delete</button>
                                </template>
                                <template v-else>
                                    <small style="margin-right: 20px; color: green;"><i>owner</i></small>
                                </template>
                            </div>
                        </li>
                    </template>
                </ul>
                <!-- Modal add orgs -->
                <div class="modal fade" id="add_orgs" tabindex="-1" aria-labelledby="add_orgs_modal" aria-hidden="true">
                    <div class="modal-dialog modal-lg">
                        <div class="modal-content">
                            <div class="modal-header">
                                <h1 class="modal-title fs-5" id="add_orgs_modal">Add Orgs</h1>
                                <button class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                            </div>
                            <div class="modal-body">
                                Orgs:
                                <select data-placeholder="Orgs" class="select2-select-add-orgs form-control" multiple name="add_orgs_select" id="add_orgs_select">
                                    <option value="None">--</option>
                                    <template v-for="org in orgs">
                                        <option v-if="!check_org_not_in(org.id)" :value="[[org.id]]">[[org.name]]</option>
                                    </template>
                                </select>
                                <div style="color: brown;" id="add_orgs_error"></div>
                            </div>
                            <div class="modal-footer">
                                <button @click="submit_add_orgs()" class="btn btn-primary">Submit</button>
                            </div>
                        </div>
                    </div>
                </div>
                
                <!-- Modal change owner -->
                <div class="modal fade" id="change_owner" tabindex="-1" aria-labelledby="change_owner_modal" aria-hidden="true">
                    <div class="modal-dialog modal-lg">
                        <div class="modal-content">
                            <div class="modal-header">
                                <h1 class="modal-title fs-5" id="change_owner_modal">Change Owner</h1>
                                <button class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                            </div>
                            <div class="modal-body">
                                Orgs:
                                <select class="form-control" name="change_owner_select" id="change_owner_select" style="width: 50%">
                                    <option value="None">--</option>
                                    <template v-for="org in orgs">
                                        <option v-if="org.id != cases_info.case.owner_org_id" :value="[[org.id]]">[[org.name]]</option>
                                    </template>
                                </select>
                                <div style="color: brown;" id="change_owner_error"></div>
                            </div>
                            <div class="modal-footer">
                                <button @click="submit_change_owner()" class="btn btn-primary">Submit</button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `
}