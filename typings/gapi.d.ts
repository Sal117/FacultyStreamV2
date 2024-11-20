declare module "gapi-script" {
  export function load(apiName: string, callback?: () => void): void;
}

declare namespace gapi {
  namespace auth2 {
      function init(params: { client_id: string; scope: string }): void;
      function getAuthInstance(): {
          signIn(): Promise<any>;
          signOut(): Promise<any>;
      };
  }

  namespace client {
      function init(params: { apiKey: string; discoveryDocs: string[] }): Promise<void>;
      namespace calendar {
          namespace events {
              function list(params: {
                  calendarId: string;
                  timeMin: string;
                  maxResults?: number;
                  singleEvents?: boolean;
                  orderBy?: string;
              }): Promise<any>;
              function insert(params: { calendarId: string; resource: any }): Promise<any>;
          }
      }
  }
}
