const API_URL =
'https://script.google.com/macros/s/AKfycbwUCq3J9slMtr-YPw_cW0CNQEJnmZy-UQyKG-EH0ZVmIS4xTbfyK_VXS5cGgJr_7TP4/exec';

async function login(){

  const username =
    document.getElementById(
      'username'
    ).value;

  const password =
    document.getElementById(
      'password'
    ).value;

  const res = await fetch(API_URL,{

    method:'POST',

    body:JSON.stringify({
      action:'loginAdmin',
      username:username,
      password:password
    })

  });

  const data =
    await res.json();

  if(data.status){

    localStorage.setItem(
      'admin',
      JSON.stringify(data.user)
    );

    window.location =
      'admin.html';

  }else{

    alert(data.message);

  }

}
