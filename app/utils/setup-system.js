import { ACCESS_TOKEN, API_URL, LOCAL_API_URL } from '@env';
import { Platform, } from 'react-native';

class System{
    constructor(){
        this.access_token = ACCESS_TOKEN;
    }
    server_link(mode='None'){
        if(Platform.OS != 'web' || mode != 'None'){
            return API_URL;
        }else{
            return LOCAL_API_URL;
        }
    }
}

export default new System();